import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import './style.css';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet';
import api from '../../services/api';

import logo from '../../assets/logo.svg';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import Dropzone from '../../components/Dropzone';

interface Item {
    id: number,
    title: string,
    image_url: string
}

interface IBEGEUFResponse {
    sigla: string
}

interface IBEGECityResponse {
    nome: string
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([])
    const [ufs, setUfs] = useState<string[]>([])
    const [cities, setCities] = useState<string[]>([])
    const [selectedFile, setSelectedFile] = useState<File>()

    const history = useHistory();

    let [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0])
    let [formData, setFormData] = useState({ name: '', email: '', whatsapp: '' })

    let [selectedItems, setSelectedItems] = useState<number[]>([])
    let [selectedUF, setSelectedUF] = useState<string>('0')
    let [selectedCity, setSelectedCity] = useState<string>('0')
    let [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0])


    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords
            setInitialPosition([latitude, longitude])
        })
    }, [])

    useEffect(() => {
        api.get('items')
            .then(response => {
                setItems(response.data)
            })
    }, [])

    useEffect(() => {
        axios.get<IBEGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
            .then((response) => {
                const UFInitials = response.data.map(UF => UF.sigla)
                setUfs(UFInitials)
            })
    })

    useEffect(() => {
        if (selectedUF === '0') {
            return
        }
        axios.get<IBEGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`)
            .then((response) => {
                const cityNames = response.data.map(city => city.nome)
                setCities(cityNames)
            })
    }, [selectedUF])

    function handleSelectedUF(event: ChangeEvent<HTMLSelectElement>) {
        const UF = event.target.value
        setSelectedUF(UF)
    }

    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value
        setSelectedCity(city)
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ])
    }

    function handleInputChante(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    function hadleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id)
        if (alreadySelected >= 0) {
            const filteresItems = selectedItems.filter(item => item !== id)

            setSelectedItems(filteresItems)
        } else {
            setSelectedItems([...selectedItems, id])
        }
    }

    async function hadleSubmit(event: FormEvent) {
        event.preventDefault()

        const { name, email, whatsapp } = formData
        const uf = selectedUF
        const city = selectedCity
        const [latitude, longitude] = selectedPosition
        const items = selectedItems

        const data = new FormData()

        data.append('name',name)
        data.append('email',email)
        data.append('whatsapp',whatsapp)
        data.append('uf',uf)
        data.append('city',city)
        data.append('latitude',String(latitude))
        data.append('longitude',String(longitude))
        data.append('items',items.join(','))

        if (selectedFile) {
            data.append('image', selectedFile)
        }

        await api.post('points', data)

        alert('Ponto de coleta criado')

        history.push('/')
    }

    return (
        <div id="page-create-point" onSubmit={hadleSubmit}>
            <header>
                <img src={logo} alt="Ecoleta" />
                <Link to="/">
                    <FiArrowLeft />
                    Volta para Home
                </Link>
            </header>

            <form >
                <h1>Cadastro do <br /> Ponto de Coleta</h1>

                <Dropzone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name"
                            onChange={handleInputChante} />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="text" name="email" id="email"
                                onChange={handleInputChante} />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp"
                                onChange={handleInputChante} />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione um Endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="UF">Estado (UF)</label>
                            <select name="uf" id="uf"
                                value={selectedUF}
                                onChange={handleSelectedUF}>
                                <option value="0">Selecione um UF</option>
                                {
                                    ufs.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city"
                                value={selectedCity}
                                onChange={handleSelectedCity}>
                                <option value="0">Selecione uma Cidade</option>
                                {
                                    cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítems de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => (
                            <li key={item.id}
                                onClick={() => hadleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}>
                                <img src={item.image_url} alt={item.title} />
                                <span>{item.title}</span>
                            </li>
                        ))}

                    </ul>
                </fieldset>
                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    )
}

export default CreatePoint